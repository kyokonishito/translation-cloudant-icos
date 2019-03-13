module.exports = {
    setResult: function (result, data , errMsg ) {
        result.json({
            translation: data,
            errMsg: errMsg
        })
    },
    setError: function (result, errMsg) {
      this.setResult(result, '', errMsg)
    }

    
  };