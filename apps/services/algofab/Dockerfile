
FROM ubuntu

ENV DEBIAN_FRONTEND='non-interactive'
RUN apt-get update && \
		apt-get upgrade -y && \
			apt-get install -y nodejs npm node-express-generator sudo slapd ldap-utils

RUN useradd -u 1002 -m -s /bin/bash admin && echo "admin:admin" | chpasswd
RUN echo "admin	ALL=(root)	NOPASSWD:ALL" > /etc/sudoers.d/admin 

USER admin

RUN sudo npm install -g supervisor

# COPY algofab/ /home/admin/algofab
# RUN chown -R $USER:$USER /home/admin/algofab 
# WORKDIR /home/admin/algofab

# RUN sudo npm install

COPY run.sh /home/admin/
WORKDIR /home/admin
ENTRYPOINT ["./run.sh"]

# RUN export DEBIAN_FRONTEND='non-interactive' && apt-get install -y slapd ldap-utils