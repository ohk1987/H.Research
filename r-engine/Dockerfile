FROM r-base:4.3.2

RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libsodium-dev \
    && rm -rf /var/lib/apt/lists/*

RUN R -e "install.packages('plumber', repos='https://cran.r-project.org', dependencies=TRUE)"
RUN R -e "install.packages('jsonlite', repos='https://cran.r-project.org')"
RUN R -e "install.packages('psych', repos='https://cran.r-project.org')"
RUN R -e "install.packages('lavaan', repos='https://cran.r-project.org')"
RUN R -e "install.packages('semTools', repos='https://cran.r-project.org')"

WORKDIR /app
COPY plumber.R .

EXPOSE 8000

CMD ["Rscript", "-e", "library(plumber); pr('plumber.R') |> pr_run(host='0.0.0.0', port=8000)"]
