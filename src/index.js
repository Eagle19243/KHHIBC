var KHHIBCBarcodeType = {
    KHHIBCBarcodeTypeConcatenated : 1,
    KHHIBCBarcodeTypePrimary : 2,
    KHHIBCBarcodeTypeSecondary : 3
}

var KHHIBC = {
    barcodeType         : null,
    labelerIDCode       : null,
    productNumber       : null,
    unitOfMeasure       : null,
    checkCharacter      : null,
    linkCharacter       : null,
    expirationDate      : null,
    manufacturingDate   : null,
    quantity            : null,
    lot                 : null,
    serial              : null,

    decode: function(barcode) {
        if (!barcode || barcode.length == 0) {
            return null
        }

        barcode = this.cleanBarcode(barcode)

        if (barcode.length > 1 &&
            barcode[0] === "+") {
            barcode = barcode.substr(1, barcode.length - 1)
        } else {
            return null
        }

        if (barcode.length < 4) {
            return null;
        }

        var lastTwo = barcode.substr(barcode.length - 2, 2)
        barcode = barcode.substr(0, barcode.length - 2)
        var array = barcode.split("/", 2)

        if (array.length == 1) {
            var barcodeData = array[0] + lastTwo

        } else if (array.length == 2) {
            var primary = this.hibcForPrimaryString(array[0], KHHIBCBarcodeType.KHHIBCBarcodeTypeConcatenated)
        }
    },

    deviceID: function() {
        if (this.labelerIDCode) {
            return `${this.labelerIDCode}${this.productNumber}${this.unitOfMeasure}`
        }
    },

    primaryHIBC: function(primaryHIBC, secondaryHIBC) {
        if (primaryHIBC.checkCharacter && 
            secondaryHIBC.linkCharacter && 
            (primaryHIBC.checkCharacter === secondaryHIBC.linkCharacter)) {
            return true
        }

        return false
    },

    cleanBarcode: function(barcode) {
        var cleanedBarcode = barcode.trim()
        
        if (cleanedBarcode.length >= 1 &&
            cleanedBarcode[0] === "*") {
            cleanedBarcode = cleanedBarcode.substr(1, cleanedBarcode.length - 1)
        }

        if (cleanedBarcode.length >= 1 && 
            cleanedBarcode[cleanedBarcode.length-1] === "*") {
            cleanedBarcode = cleanedBarcode.substr(0, cleanedBarcode.length - 1)
        }

        return cleanedBarcode
    },

    isHIBC: function(barcode) {
        return (this.cleanedBarcode(barcode)[0] === "+")
    },

    hibcForPrimaryString: function(primary, barcodeType) {

    },

    hibcForSecondaryString: function(secondary, barcodeType) {

    },

    dateFromDateString: function(string) {

    },

    substringFromDateString: function(string) {
        
    }
}

module.exports = KHHIBC