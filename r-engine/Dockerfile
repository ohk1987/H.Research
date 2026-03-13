FROM hankyeloh/h-research-r-engine:latest

RUN R -e "install.packages(c('effsize', 'lme4', 'nlme'), repos='https://cran.r-project.org')"

WORKDIR /app
COPY plumber.R .

EXPOSE 8000

CMD ["Rscript", "-e", "library(plumber); port <- as.integer(Sys.getenv('PORT', 8000)); pr('plumber.R') |> pr_run(host='0.0.0.0', port=port)"]