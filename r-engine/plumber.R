library(plumber)
library(lavaan)
library(psych)
library(jsonlite)
library(effsize)


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
  rotation <- body$rotation %||% "varimax"

  tryCatch({
    fa_result <- psych::fa(data, nfactors = n_factors,
                           rotate = rotation, fm = "pa")

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
  estimator <- body$estimator %||% "ML"
  missing_method <- body$missing %||% "fiml"

  tryCatch({
    fit <- lavaan::cfa(model_syntax, data = data,
                       estimator = estimator, missing = missing_method)

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

# ─── Phase 2-1: 기본 분석 + 고급 분석 ───

#* @post /analyze/ttest
#* @param data t-test 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  dv <- body$dv
  group <- body$group
  ci_level <- body$ci %||% 0.95

  tryCatch({
    groups <- unique(data[[group]])
    if (length(groups) != 2) {
      return(list(success = FALSE, error = "t-test에는 정확히 2개의 집단이 필요합니다."))
    }

    g1 <- data[data[[group]] == groups[1], dv]
    g2 <- data[data[[group]] == groups[2], dv]

    t_result <- t.test(g1, g2, conf.level = ci_level)
    d_result <- effsize::cohen.d(g1, g2)

    means <- list()
    means[[as.character(groups[1])]] <- round(mean(g1, na.rm = TRUE), 3)
    means[[as.character(groups[2])]] <- round(mean(g2, na.rm = TRUE), 3)

    sds <- list()
    sds[[as.character(groups[1])]] <- round(sd(g1, na.rm = TRUE), 3)
    sds[[as.character(groups[2])]] <- round(sd(g2, na.rm = TRUE), 3)

    list(
      success = TRUE,
      t = round(t_result$statistic, 3),
      df = round(t_result$parameter, 3),
      p = round(t_result$p.value, 4),
      ci = round(t_result$conf.int, 3),
      cohen_d = round(d_result$estimate, 3),
      means = means,
      sds = sds
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("t-test 분석 오류:", e$message))
  })
}

#* @post /analyze/anova
#* @param data ANOVA 분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  dv <- body$dv
  group <- body$group

  tryCatch({
    data[[group]] <- as.factor(data[[group]])
    formula <- as.formula(paste(dv, "~", group))
    aov_result <- aov(formula, data = data)
    aov_summary <- summary(aov_result)

    f_val <- round(aov_summary[[1]][["F value"]][1], 3)
    df1 <- aov_summary[[1]][["Df"]][1]
    df2 <- aov_summary[[1]][["Df"]][2]
    p_val <- round(aov_summary[[1]][["Pr(>F)"]][1], 4)

    # η² 계산
    ss_between <- aov_summary[[1]][["Sum Sq"]][1]
    ss_total <- sum(aov_summary[[1]][["Sum Sq"]])
    eta_sq <- round(ss_between / ss_total, 3)

    # 사후검정 (Tukey HSD)
    post_hoc <- NULL
    if (p_val < 0.05) {
      tukey <- TukeyHSD(aov_result)
      post_hoc <- as.data.frame(tukey[[group]])
      post_hoc$comparison <- rownames(post_hoc)
      rownames(post_hoc) <- NULL
    }

    # 집단별 기술통계
    group_stats <- aggregate(formula, data = data, FUN = function(x) {
      c(mean = round(mean(x), 3), sd = round(sd(x), 3), n = length(x))
    })

    list(
      success = TRUE,
      f = f_val,
      df1 = df1,
      df2 = df2,
      p = p_val,
      eta_squared = eta_sq,
      post_hoc = post_hoc,
      group_stats = group_stats
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("ANOVA 분석 오류:", e$message))
  })
}

#* @post /analyze/correlation
#* @param data 상관분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  method <- body$method %||% "pearson"

  tryCatch({
    cor_result <- cor(data, use = "pairwise.complete.obs", method = method)
    cor_test <- psych::corr.test(data, method = method, adjust = "none")

    list(
      success = TRUE,
      correlation = round(cor_result, 3),
      p_values = round(cor_test$p, 4),
      n = nrow(data),
      ci = cor_test$ci
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("상관분석 오류:", e$message))
  })
}

#* @post /analyze/crosstab
#* @param data 교차분석 데이터 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  var1 <- body$var1
  var2 <- body$var2

  tryCatch({
    tbl <- table(data[[var1]], data[[var2]])
    chi_result <- chisq.test(tbl)

    n <- sum(tbl)
    k <- min(nrow(tbl), ncol(tbl))
    cramers_v <- round(sqrt(chi_result$statistic / (n * (k - 1))), 3)

    list(
      success = TRUE,
      chi_squared = round(chi_result$statistic, 3),
      df = chi_result$parameter,
      p = round(chi_result$p.value, 4),
      cramers_v = as.numeric(cramers_v),
      observed = as.data.frame.matrix(tbl),
      expected = round(as.data.frame.matrix(chi_result$expected), 3)
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("교차분석 오류:", e$message))
  })
}

#* @post /analyze/process
#* @param data PROCESS 모형 분석 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  model_syntax <- body$model
  bootstrap <- body$bootstrap %||% 5000
  estimator <- body$estimator %||% "ML"

  tryCatch({
    fit <- lavaan::sem(model_syntax, data = data,
                       estimator = estimator,
                       se = "bootstrap", bootstrap = bootstrap)

    all_params <- lavaan::parameterEstimates(fit, standardized = TRUE, ci = TRUE)
    indirect <- all_params[all_params$op == ":=", ]
    direct <- all_params[all_params$op == "~", ]

    fit_measures <- lavaan::fitMeasures(fit,
      c("cfi", "tli", "rmsea", "srmr"))

    list(
      success = TRUE,
      parameters = all_params,
      indirect_effects = indirect,
      direct_effects = direct,
      fit_measures = as.list(round(fit_measures, 3))
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("PROCESS 분석 오류:", e$message))
  })
}

#* @post /analyze/plssem
#* @param data PLS-SEM 분석 (JSON)
function(req) {
  if (!requireNamespace("seminr", quietly = TRUE)) {
    return(list(success = FALSE, error = "PLS-SEM 엔진 준비 중입니다."))
  }

  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  measurement_model <- body$measurement
  structural_model <- body$structural

  tryCatch({
    # seminr 측정모형 구성
    mm <- eval(parse(text = measurement_model))
    sm <- eval(parse(text = structural_model))

    pls_model <- seminr::estimate_pls(
      data = data,
      measurement_model = mm,
      structural_model = sm
    )

    boot_model <- seminr::bootstrap_model(pls_model, nboot = 1000)

    summary_pls <- summary(pls_model)
    summary_boot <- summary(boot_model)

    list(
      success = TRUE,
      path_coefficients = round(summary_pls$paths, 3),
      r_squared = round(summary_pls$paths[, "R^2"], 3),
      reliability = list(
        alpha = round(summary_pls$reliability$alpha, 3),
        rho_c = round(summary_pls$reliability$rhoC, 3),
        ave = round(summary_pls$reliability$AVE, 3)
      ),
      bootstrap = list(
        paths = round(summary_boot$bootstrapped_paths, 3)
      )
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("PLS-SEM 분석 오류:", e$message))
  })
}

#* @post /analyze/mga
#* @param data 다중집단분석 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)
  model_syntax <- body$model
  group_var <- body$group
  estimator <- body$estimator %||% "ML"

  tryCatch({
    # Configural invariance
    fit_configural <- lavaan::cfa(model_syntax, data = data,
                                   group = group_var,
                                   estimator = estimator)
    fm_configural <- lavaan::fitMeasures(fit_configural,
      c("cfi", "tli", "rmsea", "srmr"))

    # Metric invariance
    fit_metric <- lavaan::cfa(model_syntax, data = data,
                               group = group_var,
                               group.equal = c("loadings"),
                               estimator = estimator)
    fm_metric <- lavaan::fitMeasures(fit_metric,
      c("cfi", "tli", "rmsea", "srmr"))

    # Scalar invariance
    fit_scalar <- lavaan::cfa(model_syntax, data = data,
                               group = group_var,
                               group.equal = c("loadings", "intercepts"),
                               estimator = estimator)
    fm_scalar <- lavaan::fitMeasures(fit_scalar,
      c("cfi", "tli", "rmsea", "srmr"))

    delta_cfi_metric <- round(fm_configural["cfi"] - fm_metric["cfi"], 3)
    delta_cfi_scalar <- round(fm_metric["cfi"] - fm_scalar["cfi"], 3)

    list(
      success = TRUE,
      configural = as.list(round(fm_configural, 3)),
      metric = as.list(round(fm_metric, 3)),
      scalar = as.list(round(fm_scalar, 3)),
      delta_cfi_metric = as.numeric(delta_cfi_metric),
      delta_cfi_scalar = as.numeric(delta_cfi_scalar)
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("MGA 분석 오류:", e$message))
  })
}

#* @post /analyze/cmv
#* @param data CMV 분석 (JSON)
function(req) {
  body <- jsonlite::fromJSON(req$postBody)
  data <- as.data.frame(body$data)

  tryCatch({
    # Harman's single-factor test
    fa_one <- psych::fa(data, nfactors = 1, rotate = "none", fm = "pa")
    first_factor_var <- round(fa_one$Vaccounted[2, 1] * 100, 1)
    is_problematic <- first_factor_var > 50

    interpretation <- if (is_problematic) {
      paste0("단일요인이 전체 분산의 ", first_factor_var,
             "%를 설명하여 50% 기준을 초과하였다. 동일방법편의가 우려된다.")
    } else {
      paste0("단일요인이 전체 분산의 ", first_factor_var,
             "%를 설명하여 50% 기준 이하로, 동일방법편의가 심각하지 않은 것으로 판단된다.")
    }

    list(
      success = TRUE,
      harman = list(
        first_factor_variance = first_factor_var,
        is_problematic = is_problematic,
        interpretation = interpretation
      )
    )
  }, error = function(e) {
    list(success = FALSE, error = paste("CMV 분석 오류:", e$message))
  })
}
