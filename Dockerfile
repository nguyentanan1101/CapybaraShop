FROM php:8.2-apache

# Copy code vào container
COPY . /var/www/html/

# Cài các extension PHP cần (ví dụ PDO MySQL)
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Bật mod rewrite (nếu cần)
RUN a2enmod rewrite
