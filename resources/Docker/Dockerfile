FROM php:7.4.0-alpine

RUN apk add tzdata

ADD resources/src /var/www/html

CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www/html"]

EXPOSE 8080 

ENV TZ=Asia/Taipei
