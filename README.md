# Orangepad API Server

## `iptables` Routing
```
iptables -t nat -A PREROUTING -i ens3 -p tcp --dport 80 -j REDIRECT --to-port 6565
iptables -t nat -A PREROUTING -i ens3 -p tcp --dport 443 -j REDIRECT --to-port 6566
```
## Creating non root nologin system userId
`useradd -s /usr/sbin/nologin -r -M -d /dev/null orange-api`


## Edit this table before system deployment

CREATE SCHEMA `orangepad_api` DEFAULT CHARACTER SET latin1;

CREATE TABLE `orangepad_api`.`clients` (
  `id_client` INT(11) NOT NULL,
  `login` VARCHAR(40) NOT NULL,
  `phone` BIGINT(20) UNSIGNED NOT NULL,
  `cc` INT(11) UNSIGNED NULL,
  `user_pass` VARCHAR(40) NOT NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `email` VARCHAR(200) NOT NULL,
  UNIQUE INDEX `id_client_UNIQUE` (`id_client` ASC),
  UNIQUE INDEX `login_UNIQUE` (`login` ASC),
  UNIQUE INDEX `phone_UNIQUE` (`phone` ASC),
  PRIMARY KEY (`login`));

CREATE TABLE `orangepad_api`.`sms_verification` (
  `incident_id` INT(11) NOT NULL AUTO_INCREMENT,
  `message_id` VARCHAR(20) NULL,
  `sender_id` VARCHAR(20) NULL,
  `sms_receiver_number` VARCHAR(20) NULL,
  `status_code` INT UNSIGNED NULL,
  `error_text` VARCHAR(255) NULL,
  `verification_code` VARCHAR(20) NULL,
  `message_price` DECIMAL(12,4) NULL,
  `remaining_balance` DECIMAL(12,4) NULL,
  `id_client` INT(11) UNSIGNED NULL,
  `expire` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`incident_id`));
