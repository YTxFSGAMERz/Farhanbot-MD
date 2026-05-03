/**
 * FarhanBot-MD - A WhatsApp Bot
 * Copyright (c) 2024 FSGAMERz
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Integration by FSGAMERz
 */
const axios = require("axios")
const cheerio = require("cheerio")
const { resolve } = require("path")
const util = require("util")
let BodyForm = require('form-data')
let { fromBuffer } = require('file-type')
let fs = require('fs')
const child_process = require('child_process')
const ffmpeg = require('fluent-ffmpeg')

const {unlink } = require ('fs').promises


exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}
exports.fetchBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "GET",
			url,
			headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}

exports.reSize = (buffer, ukur1, ukur2) => {
    return new Promise(async (resolve, reject) => {
        var baper = await Jimp.read(buffer);
        var ab = await baper.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG)
        resolve(ab)
    })
}

exports.runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

exports.getTime = (format, date) => {
	if (date) {
		return moment(date).locale('id').format(format)
	} else {
		return moment.tz('Asia/Jakarta').locale('id').format(format)
	}
}

exports.formatDate = (n, locale = 'id') => {
	let d = new Date(n)
	return d.toLocaleDateString(locale, {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	})
}

exports.formatp = sizeFormatter({
    std: 'JEDEC', //'SI' = 1000, 'IEC' = 1024, 'JEDEC' = 1024
    decimalPlaces: 2,
    keepTrailingZeros: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
})

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

function sizeFormatter(...args) {
	return (size) => {
		const { std, decimalPlaces, keepTrailingZeros, render } = args[0]
		const bytes = size
		const k = std === 'SI' ? 1000 : 1024
		if (bytes === 0) return render(0, '')
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		const literal = (bytes / Math.pow(k, i)).toFixed(decimalPlaces)
		const symbol = ['','K','M','G','T','P','E','Z','Y'][i]
		return render(keepTrailingZeros ? literal : parseFloat(literal), symbol)
	}
}

exports.logic = (check, b, a) => {
    if (b.length !== a.length) throw new Error('Status and Solutions must be same length')
    for (let i in a) if (check <= a[i]) return b[i]
}

exports.generateProfilePicture = async (buffer) => {
	const jimp = await Jimp.read(buffer)
	const min = jimp.getWidth()
	const max = jimp.getHeight()
	const cropped = jimp.crop(0, 0, min, max)
	return {
		img: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG),
		preview: await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG)
	}
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
            .then((res) => {
                let length = res.headers['content-length']
                resolve(exports.bytesToSize(length, 2))
            })
        } else if (Buffer.isBuffer(path)) {
            let length = path.length
            resolve(exports.bytesToSize(length, 2))
        } else {
            fs.stat(path, (err, stats) => {
                if (err) reject(err)
                resolve(exports.bytesToSize(stats.size, 2))
            })
        }
    })
}

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

exports.getGroupAdmins = (participants) => {
        let admins = []
        for (let i of participants) {
            i.admin === "admin" ? admins.push(i.id) : ''
            i.admin === "superadmin" ? admins.push(i.id) : ''
        }
        return admins
    }

/**
 * 
 * @param {String} url 
 * @returns 
 */
exports.TelegraPh = (Path) => {
	return new Promise (async (resolve, reject) => {
		if (!fs.existsSync(Path)) return reject(new Error("File not Found"))
		try {
			const form = new BodyForm();
			form.append("file", fs.createReadStream(Path))
			const data = await  axios({
				url: "https://telegra.ph/upload",
				method: "POST",
				headers: {
					...form.getHeaders()
				},
				data: form
			})
			return resolve("https://telegra.ph" + data.data[0].src)
		} catch (err) {
			return reject(new Error(String(err)))
		}
	})
}
const sleepy = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.buffergif = async (image) => {
        
	const filename = `${Math.random().toString(36)}`
			await fs.writeFileSync(`./Media/trash/${filename}.gif`, image)
					 child_process.exec(
								`ffmpeg -i ./Media/trash/${filename}.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ./Media/trash/${filename}.mp4`
										) 
  await sleepy(4000)
  
	var buffer5  =  await  fs.readFileSync(`./Media/trash/${filename}.mp4`)
	Promise.all([unlink(`./Media/video/${filename}.mp4`), unlink(`./Media/gif/${filename}.gif`)])
	return buffer5
				   }

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
