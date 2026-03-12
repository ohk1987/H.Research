library(plumber)
library(lavaan)
library(psych)
library(jsonlite)

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
