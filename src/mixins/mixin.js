
let encodeAddress = require("./address")

let addressType = 1;

//
function addressSplice (item , num) {
	if (typeof item != 'undefined' && item != null) {
		if(item.length>30){
			if(item.indexOf("0x") == 0)
				return item.substr(2,num) + '...' + item.substr(item.length-num,item.length)
			else
				return item.substr(0,num) + '...' + item.substr(item.length-num,item.length)
		}
	}
	return ""
};

function addressEncode(path){
	return addressEncode16(path);
};

function addressEncode16(path){
	let address =  splice0x(path)
	return encodeAddress.do58EncodeAddress('0600'+address)
};

function splice0x(str){
		if(str && str.length>0){
			if(str.indexOf("0x") !==0){

				return str
			}
			let t = str.replace("0x","")
			return  t
		}
		return str
};

function getMainBlance(available){
	return parseFloat(available / Math.pow(10,9).toFixed(7));
};

function addressDecode16(path){
	if(path && path.indexOf('B')==0){
		path = encodeAddress.do58DecodeAddress(path)
		path = path.replace('0600','')
		path = `0x${path}`
	}
	return path
};

function addressDcodeEmoji(path){
	let address = "";

	let encodeStr = encodeURI(path);
	for(let i=0;i<encodeStr.length;i=i+12){
		let encodeOne =  encodeStr.substr(i,12);
		for(let n=0;n<emojiStr.length;n++){
			if(encodeOne == encodeURI(emojiStr[n])){
				let one = n.toString(16);
				if(one.length<2)
					one = "0"+one;
				address += one;
			}
		}
	}

	return address;
};






export {
	addressEncode,
	addressSplice,
	splice0x,
	getMainBlance,
	addressDecode16,
	addressDcodeEmoji,
	addressEncode16
}
