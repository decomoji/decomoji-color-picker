const path = require('path')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const mkdirp = require('mkdirp')
const PNG = require('png-js')
const DecomojiColorsHEX = require('@decomoji/colors').DecomojiColors.map(v => v.hex)

const inputDir = argv['input-dir'] || 'input'
const output = argv.output || 'output/result.tsv'

const files = fs
  .readdirSync(inputDir)
  .filter(file => /\.png$/.test(file))
  .map(file => path.resolve(inputDir, file))
const promises = files.map(readColor)

Promise.all(promises).then(colors => {
  mkdirp.sync(path.dirname(output))
  fs.writeFileSync(
    output,
    colors
      .map(([file, color]) => {
        file = path.basename(file, '.png')
        return `${file}\t${color}`
      })
      .join('\n')
  )
})

function colorIndex({ r, g, b }) {
  const rr = r.toString(16).padStart(2, '0')
  const gg = g.toString(16).padStart(2, '0')
  const bb = b.toString(16).padStart(2, '0')
  return DecomojiColorsHEX.indexOf(`${rr}${gg}${bb}`)
}

function readColor(file) {
  return new Promise(resolve => {
    PNG.decode(file, function(buffer) {
      let color
      for (let i = 0; i < buffer.length; i += 4) {
        const r = buffer[i]
        const g = buffer[i + 1]
        const b = buffer[i + 2]
        const a = buffer[i + 3]
        if (a === 255) {
          color = { r, g, b }
          break
        }
      }
      const index = colorIndex(color)
      if (index < 0) {
        resolve([file, `★★★ ${JSON.stringify(color)} ★★★`])
      } else {
        resolve([file, index])
      }
    })
  })
}
