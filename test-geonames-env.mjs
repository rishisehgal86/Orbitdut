import { config } from 'dotenv';
config();

console.log('GEONAMES_USERNAME:', process.env.GEONAMES_USERNAME || '(not set)');
console.log('Length:', (process.env.GEONAMES_USERNAME || '').length);
