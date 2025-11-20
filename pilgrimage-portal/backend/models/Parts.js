const mongoose = require('mongoose');


const PartsSchema = new mongoose.Schema({
  section: { type: String, required: true },
  sectionDescription: { type: String, default: '' },
  memberName: { type: String, required: true },
  noOfPersons: { type: Number, required: true },
  sradam: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Parts', PartsSchema);