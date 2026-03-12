FROM r-base:4.3.2

RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY packages.R .
RUN Rscript packages.R

COPY plumber.R .

EXPOSE 8000

CMD ["Rscript", "-e", "library(plumber); pr('plumber.R') |> pr_run(host='0.0.0.0', port=8000)"]
