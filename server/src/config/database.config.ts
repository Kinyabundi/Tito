import * as Joi from 'joi';
import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  mongo: {
    uri: string;
  };
  // telegram: {
  //   botToken: string;
  // };
  // openai: {
  //   apiKey: string;
  // };
  // cdp: {
  //   apiKey: string;
  //   privateKey: string;
  //   networkId: string;
  // };
  // wallet: {
  //   mnemonicPhrase: string;
  // };
  facilitator: {
    url: string;
  };
  address: string;
}

const configSchema = Joi.object<DatabaseConfig>({
  mongo: Joi.object({
    uri: Joi.string().required(),
  }).required(),
  // telegram: Joi.object({
  //   botToken: Joi.string().required(),
  // }).required(),
  // openai: Joi.object({
  //   apiKey: Joi.string().required(),
  // }).required(),
  // cdp: Joi.object({
  //   apiKey: Joi.string().required(),
  //   privateKey: Joi.string().required(),
  //   networkId: Joi.string().required(),
  // }).required(),
  // wallet: Joi.object({
  //   mnemonicPhrase: Joi.string().required(),
  // }).required(),
  facilitator: Joi.object({
    url: Joi.string().required(),
  }).required(),
  address: Joi.string().required(),
});

const config: DatabaseConfig = {
  mongo: {
    uri: process.env.MONGODB_URI ,
  },
  // telegram: {
  //   botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  // },
  // openai: {
  //   apiKey: process.env.OPENAI_API_KEY || '',
  // },
  // cdp: {
  //   apiKey: process.env.CDP_API_KEY || '',
  //   privateKey: process.env.CDP_API_KEY_PRIVATE_KEY || '',
  //   networkId: process.env.NETWORK_ID || '',
  // },
  // wallet: {
  //   mnemonicPhrase: process.env.WALLET_MNEMONIC_PHRASE || '',
  // },
  facilitator: {
    url: process.env.FACILITATOR_URL || '',
  },
  address: process.env.ADDRESS || '',
};

const { error, value } = configSchema.validate(config, {
  allowUnknown: true,
  abortEarly: false,
});

if (error) {
  console.error('Configuration validation errors:');
  for (const detail of error.details) {
    console.error(detail.message);
  }
  throw new Error('Missing configuration options');
}

export default value;