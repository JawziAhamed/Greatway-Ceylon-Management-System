const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/greatway_ceylon');
  const collection = mongoose.connection.collection('companysettings');
  const doc = await collection.findOne();
  if (doc && typeof doc.address === 'object') {
    await collection.updateOne(
      { _id: doc._id },
      { $set: { address: 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300' } }
    );
    console.log('Fixed address to string in DB');
  } else {
    console.log('Address is already string or ok');
  }
  await mongoose.disconnect();
}

fix();
