import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.join(__dirname, '.env')});

mongoose.connect(process.env.DB).then(async ()=>{
  const User = mongoose.model('User', new mongoose.Schema({}, {strict: false, collection: 'users'}));
  const users = await User.find({});
  let count = 0;
  for(let u of users) {
    if(u._doc && u._doc.name && !u._doc.fullname) {
      await User.updateOne({_id: u._id}, {$set: {fullname: u._doc.name}, $unset: {name: 1}});
      count++;
    } else if(u._doc && u._doc.name && u._doc.fullname) {
      await User.updateOne({_id: u._id}, {$unset: {name: 1}});
      count++;
    }
  }
  console.log('Migrated users:', count);
  process.exit(0);
});
