import * as dotenv from 'dotenv';

dotenv.config();

const { PORT, DB_CONNECTION_STRING } = process.env;

if (!PORT || !DB_CONNECTION_STRING) {
  throw new Error('.env file was not configured properly');
}

const environment = {
  port: PORT,
  databaseConnectionString: DB_CONNECTION_STRING,
};

export default environment;
