/*

var bisa = 'genap' || 'ganjil'
fakhran[1].dzaky()['idham'][0]()[1](false)[bisa] // tika
fakhran[1].dzaky()['idham'][0]()[1](true)[bisa] // tari

*/
let bisa = "genap";
let fakhran = [
  "nope",
  // dzaky = () => { idham }
  { dzaky = { idham = () => [() => [null, (bisa, props) => (props ? "tari" : "tika")], null], a: null } }
];

// console.log(
//   fakhran[1]
//     .dzaky()
//     ["idham"][0]()[1](true)[bisa]
// );

console.log(fakhran[1].dzaky()["idham"]);
