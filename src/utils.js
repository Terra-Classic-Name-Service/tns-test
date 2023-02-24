import pkg from 'js-sha3';
import pkgIdna from 'idna-uts46-hx';

const { sha3_256: SHA256 } = pkg;
const { toUnicode } = pkgIdna;

export function namehash(inputName) {
  var node = ''
  for (var i = 0; i < 32; i++) {
    node += '00'
  }

  var name = inputName;//normalize(inputName)

  if (name) {
    var labels = name.split('.')

    for(var i = labels.length - 1; i >= 0; i--) {
      var labelSha = SHA256(labels[i])
      node = SHA256(new Buffer(node + labelSha, 'hex'))
    }
  }

  return '0x' + node
}

function normalize(name) {
  return name ? toUnicode(name, {useStd3ASCII: true, transitional: false}) : name
}

/**
 * 十六进制转 bytearray
 */
export function hex2ab(hex) {
  var typedArray = new Uint8Array((hex.match(/[\da-f]{2}/gi)).map(function (h) {
    return parseInt(h, 16)
  }))

  var buffer = typedArray.buffer
  return buffer
}