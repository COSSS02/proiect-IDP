-- Create the database for the main application
CREATE DATABASE IF NOT EXISTS `e-shop`;

-- Create a dedicated user for the main application
CREATE USER IF NOT EXISTS 'dev'@'%' IDENTIFIED BY 'dev';

-- Grant all privileges on the e-shop to the new user
GRANT ALL PRIVILEGES ON `e-shop`.* TO 'dev'@'%';

-- Apply the changes
FLUSH PRIVILEGES;