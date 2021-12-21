function ajaxMethod(url, data, method, success) {
    let ajax = new XMLHttpRequest();
    if (method == 'get') {
        if (data) {
            url += '?';
            url += formateObjToParamStr(data);
        }
        ajax.open(method, url);
        ajax.send(null);
    } else {
        ajax.open(method, url);
        ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        if (data) {
            ajax.send(data);
        } else {
            ajax.send();
        }
    }
    return new Promise((resolve, reject) => {
        ajax.onreadystatechange = function () {
            console.log(ajax.readyState+","+ajax.status+ajax.responseText)

            if (ajax.readyState == 4 && ajax.status == 200) {
                resolve(ajax.responseText);
            }
        }
    })
}

function filter(str) {
    str += '';
    str = str.replace(/%/g, '%25');
    str = str.replace(/\+/g, '%2B');
    str = str.replace(/ /g, '%20');
    str = str.replace(/\//g, '%2F');
    str = str.replace(/\?/g, '%3F');
    str = str.replace(/&/g, '%26');
    str = str.replace(/\=/g, '%3D');
    str = str.replace(/#/g, '%23');
    return str;
}

function formateObjToParamStr(paramObj) {
    const sdata = [];
    for (let attr in paramObj) {
        sdata.push(`${attr}=${filter(paramObj[attr])}`);
    }
    return sdata.join('&');
};
export {ajaxMethod};
