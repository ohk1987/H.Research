library(plumber)
library(lavaan)
library(psych)
library(jsonlite)

# NULL 대체 연산자
`%||%` <- function(a, b) if (is.null(a)) b else a

#* @get /health
function() {
  list(status = "ok", timestamp = Sys.time())
}

#* @post /analyze/descriptive
#* @param data 분석할 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)

  result <- lapply(names(data), function(col) {
    x <- data[[col]]
    if (is.numeric(x)) {
      list(
        variable = col,
        n = sum(!is.na(x)),
        mean = round(mean(x, na.rm = TRUE), 3),
        sd = round(sd(x, na.rm = TRUE), 3),
        min = round(min(x, na.rm = TRUE), 3),
        max = round(max(x, na.rm = TRUE), 3),
        skewness = round(psych::skew(x, na.rm = TRUE), 3),
        kurtosis = round(psych::kurtosi(x, na.rm = TRUE), 3)
      )
    }
  })

  list(success = TRUE, results = result)
}

#* @post /analyze/reliability
#* @param data 신뢰도 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)

  alpha_result <- psych::alpha(data)

  list(
    success = TRUE,
    alpha = round(alpha_result$total$raw_alpha, 3),
    std_alpha = round(alpha_result$total$std.alpha, 3),
    item_stats = alpha_result$item.stats
  )
}

#* @post /analyze/efa
#* @param data EFA 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  n_factors <- body$nFactors %||% 1

  tryCatch({
    fa_result <- psych::fa(data, nfactors = n_factors,
                           rotate = "varimax", fm = "pa")

    list(
      success = TRUE,
      loadings = as.data.frame(unclass(fa_result$loadings)),
      communalities = as.list(fa_result$communalities),
      fit = list(
        rmsea = round(fa_result$RMSEA[1], 3),
        tli = round(fa_result$TLI, 3)
      )
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("EFA 분석 오류:", e$message))
  })
}

#* @post /analyze/cfa
#* @param data CFA 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  model_syntax <- body$model

  tryCatch({
    fit <- lavaan::cfa(model_syntax, data = data,
                       estimator = "ML", missing = "fiml")

    fit_measures <- lavaan::fitMeasures(fit,
      c("cfi", "tli", "rmsea", "rmsea.ci.lower", "rmsea.ci.upper",
        "srmr", "aic", "bic"))

    params <- lavaan::parameterEstimates(fit, standardized = TRUE)

    # 잠재변수별 AVE, CR 계산
    latent_vars <- unique(params[params$op == "=~", "lhs"])
    ave_cr <- lapply(latent_vars, function(lv) {
      std_loads <- params[params$op == "=~" & params$lhs == lv, "std.all"]
      ave <- round(mean(std_loads^2), 3)
      cr <- round(sum(std_loads)^2 / (sum(std_loads)^2 + sum(1 - std_loads^2)), 3)
      list(variable = lv, ave = ave, cr = cr)
    })

    list(
      success = TRUE,
      fit_measures = as.list(round(fit_measures, 3)),
      parameters = params,
      ave_cr = ave_cr
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("CFA 분석 오류:", e$message))
  })
}

#* @post /analyze/sem
#* @param data SEM 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  model_syntax <- body$model
  bootstrap <- body$bootstrap %||% 5000
  estimator <- body$estimator %||% "ML"
  missing_method <- body$missing %||% "fiml"

  tryCatch({
    fit <- lavaan::sem(model_syntax, data = data,
                       estimator = estimator, missing = missing_method,
                       se = "bootstrap", bootstrap = bootstrap)

    fit_measures <- lavaan::fitMeasures(fit,
      c("cfi", "tli", "rmsea", "rmsea.ci.lower", "rmsea.ci.upper", "srmr"))

    params <- lavaan::parameterEstimates(fit, standardized = TRUE, ci = TRUE)

    list(
      success = TRUE,
      fit_measures = as.list(round(fit_measures, 3)),
      parameters = params
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("SEM 분석 오류:", e$message))
  })
}

#* @post /analyze/mediation
#* @param data 매개분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  model_syntax <- body$model
  bootstrap <- body$bootstrap %||% 5000

  tryCatch({
    fit <- lavaan::sem(model_syntax, data = data,
                       se = "bootstrap", bootstrap = bootstrap)

    all_params <- lavaan::parameterEstimates(fit, standardized = TRUE, ci = TRUE)
    indirect <- all_params[all_params$op == ":=", ]

    list(
      success = TRUE,
      indirect_effects = indirect,
      parameters = all_params
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("매개분석 오류:", e$message))
  })
}
