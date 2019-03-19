var express = require('express')
var app = express();
var router = express.Router();
var util = require('util');
var watson = require('watson-developer-cloud');
var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3');
var async = require('async');
var conf = require('config');
var vcapServices;

const fs = require("fs");
const formidable = require("formidable");
var tools = require('./tools');
const Encoding = require('encoding-japanese');

const langmodels = [
    {modelid : 'en-ar', source: 'English', target: 'Arabic'},
    {modelid : 'en-cs', source: 'English', target: 'Czech'},
    {modelid : 'en-da', source: 'English', target: 'Danish'},
    {modelid : 'en-de', source: 'English', target: 'German'},
    {modelid : 'en-es', source: 'English', target: 'Spanish'},
    {modelid : 'en-fi', source: 'English', target: 'Finnish'},
    {modelid : 'en-fr', source: 'English', target: 'French'},
    {modelid : 'en-hi', source: 'English', target: 'Hindi'},
    {modelid : 'en-hu', source: 'English', target: 'Hungarian'},
    {modelid : 'en-it', source: 'English', target: 'Italian'},
    {modelid : 'en-ja', source: 'English', target: 'Japanese'},
    {modelid : 'en-ko', source: 'English', target: 'Korean'},
    {modelid : 'en-nb', source: 'English', target: 'Norwegian Bokmal'},
    {modelid : 'en-nl', source: 'English', target: 'Dutch'},
    {modelid : 'en-pl', source: 'English', target: 'Polish'},
    {modelid : 'en-pt', source: 'English', target: 'Portuguese'},
    {modelid : 'en-ru', source: 'English', target: 'Russian'},
    {modelid : 'en-sv', source: 'English', target: 'Swedish'},
    {modelid : 'en-tr', source: 'English', target: 'Turkish'},
    {modelid : 'en-zh', source: 'English', target: 'Simplified Chinese'},
    {modelid : 'en-zh-TW', source: 'English', target: 'Traditional Chinese'}
]


var Cloudant = require('@cloudant/cloudant');
var ICOS = require('ibm-cos-sdk');

if(process.env.VCAP_SERVICES) {
    vcapServices = JSON.parse(process.env.VCAP_SERVICES);
} else {
    vcapServices = conf
}

var cloudant = new Cloudant({ url: vcapServices.cloudantNoSQLDB[0].credentials.url, plugins: { iamauth: { iamApiKey: vcapServices.cloudantNoSQLDB[0].credentials.apikey } } });

const dbName = process.env.CLOUDANT_DBNAME;
var db = cloudant.use(dbName);

const backetName = process.env.ICOS_BACKETNAME;
var config = {
    endpoint: process.env.ICOS_ENDPOINT,
    apiKeyId: process.env.ICOS_APIKEY,
    ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
    serviceInstanceId:  process.env.ICOS_RESOURCE_INSTANCE_ID
};

var cos = new ICOS.S3(config);
async function doCreateObject( bucket, key, file) {
    console.log('Creating object:' + key );
    var parms = {
        Bucket: bucket,
        Key: key,
        ACL: 'public-read',
        Body: file
    };
    const putobjectPromise = util.promisify(cos.putObject);
    var response = await putobjectPromise.call(cos, parms);
    return response;    
}

var languageTranslator = new LanguageTranslatorV3({
  version: '2018-05-01',
  iam_apikey: vcapServices.language_translator[0].credentials.apikey,
  url: vcapServices.language_translator[0].credentials.url
});

async function translate(text, model) {
    console.log("translate Start:[" + model +"]")
    var params = {
        text: text,
        model_id: model
    };
    const translatePromise = util.promisify(languageTranslator.translate);
    var response = await translatePromise.call(languageTranslator, params);
    response.modelid = model;
    var modelinfo = langmodels.filter(function(item, index){
        if (item.modelid == model) return true;
      });
    if(modelinfo.length > 0){
        response.langname = modelinfo[0].target;
    } else {
        response.langname = 'English'
    }
    return response;
}

function setFileNameWithLang(filename, modelid){
    var lastdot_pos = filename.lastIndexOf('.');

    if (lastdot_pos > 1   ){
        return filename.substring(0, lastdot_pos )+ '_' + modelid.substring(3) + filename.substring(lastdot_pos )
    } else {
        return filename + '_' + modelid.substring(3);
    }
}

router.post('/', async function(req, res) {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, async function (err, fields, files) {
        if (err) {
            console.log(err);
            tools.setError(res,'Error: No Parameters' )
        } else {
            
            if ( !Object.keys(files).length){
                tools.setError(res,'Error: No file' )
                console.log('Error: No file');
                return;

            }
            const fileinfo = JSON.parse(JSON.stringify(files));
            console.log(fileinfo);
            
            const filePath = fileinfo.file.path;
            var uploadfileArray = fs.readFileSync(filePath);
            if (!Encoding.detect(uploadfileArray)){
                tools.setError(res,'Error: not Japanese text file' )
                console.log('Error: not Japanese text file');
                return;
            } else if (Encoding.detect(uploadfileArray) == 'BINARY') {
                tools.setError(res,'Error: not text file' )
                console.log('Error: not text file');
                return;
            };

            var orgStr = Encoding.convert(uploadfileArray,  {
                to: 'UNICODE',
                type: 'string' 
            });

            try {
                var response =  await translate(orgStr, 'ja-en');
            } catch (e) {
                tools.setError(res,'Error: translate' + e )
                console.log('Error: translate:'+ e);
                return; 
            }

            enStr =response.translations[0].translation
            var translateFunc = []
            langmodels.forEach(function( value ) {
                translateFunc.push( translate(enStr, value.modelid) );
            });

            try {
                var transResults = await Promise.all(translateFunc);
            } catch (e) {
                tools.setError(res,'Error: translate' + e )
                console.log('Error: translate:'+ e);
                return; 
            }

            var fileinfo_rec = {};
            fileinfo_rec.filename = fileinfo.file.name;
            fileinfo_rec.sourceText = orgStr;
            fileinfo_rec.fileurl = process.env.ICOS_ENDPOINT + '/' + backetName + '/' + fileinfo_rec.filename ;            ;
            fileinfo_rec.tranlatedTexts =[{}];
            fileinfo_rec.tranlatedTexts[0].lang = 'en';
            fileinfo_rec.tranlatedTexts[0].langname = 'English';
            fileinfo_rec.tranlatedTexts[0].filename = setFileNameWithLang(fileinfo.file.name, 'ja-en');
            fileinfo_rec.tranlatedTexts[0].text = enStr;
            fileinfo_rec.tranlatedTexts[0].fileurl = process.env.ICOS_ENDPOINT + '/' + backetName + '/' + fileinfo_rec.tranlatedTexts[0].filename ;
            fileinfo_rec.checkTextEn = enStr;



            transResults.forEach(function( value ) {
                var tansinfo = {};
                if(value.modelid.split('-')[1] == 'ja'){
                    fileinfo_rec.checkTextJp = value.translations[0].translation;
                } else {
                    tansinfo.lang = value.modelid.split('-')[1];
                    tansinfo.langname = value.langname;
                    tansinfo.filename = setFileNameWithLang(fileinfo.file.name, value.modelid);
                    tansinfo.text = value.translations[0].translation;
                    tansinfo.fileurl = process.env.ICOS_ENDPOINT + '/' + backetName + '/' +  tansinfo.filename ;
                    fileinfo_rec.tranlatedTexts.push(tansinfo);
                } 
            });

            fileinfo_rec.created_timestamp = new Date().toISOString();
            

            db.insert(fileinfo_rec, '', async function(err, doc) {
                    if(err) {
                        tools.setError(res,'Error: db insert' + err )
                        console.log('Error: db insert' + err);                                               
                    } else {
                        let cosFunc = []
                        fileinfo_rec.tranlatedTexts.forEach(function( value ) {
                            cosFunc.push( doCreateObject(backetName, value.filename, value.text) );
                        });

                        try {
                            let cosResults = await Promise.all(cosFunc);
                        } catch (e) {
                            tools.setError(res,'Error: cos save' + e )
                            console.log('Error: cos save:'+ e);
                            return; 
                        }
                        tools.setResult(res, fileinfo_rec, '');
                        return;

                    }
                
            });
            
        };
    });
});




module.exports = router;