FROM nginx:alpine
COPY . /usr/share/nginx/html
#COPY default.conf /etc/nginx/conf.d/default.conf
# Copia o arquivo conf para a pasta de templates (o Nginx vai injetar a variável aqui)
COPY default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80