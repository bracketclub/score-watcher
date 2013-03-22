var Entry = new require('./entryModel');

function Database() {

}

Database.prototype.findMaster = function(cb) {
  Entry.findOne({username: '-MASTER-'}, cb);
};

Database.prototype.updateMaster = function(bracket, cb) {
  Entry.findOneAndUpdate({username: '-MASTER-'}, {bracket: bracket}, {upsert: true}, cb);
};

module.exports = Database;