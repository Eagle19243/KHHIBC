var moment = require('moment')

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
        var array = this.splitWithLimit(barcode, "/", 2)

        if (array.length == 1) {
            var barcodeData = array[0] + lastTwo
            var firstLetter = barcodeData[0]

            if (this.isLetter(firstLetter)) {
                return this.hibcForPrimaryString(barcodeData, KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary)
            } else {
                return this.hibcForSecondaryString(barcodeData, KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary)
            }

        } else if (array.length == 2) {
            var primary = this.hibcForPrimaryString(array[0], KHHIBCBarcodeType.KHHIBCBarcodeTypeConcatenated)
            var secondary = this.hibcForSecondaryString(array[1] + lastTwo, KHHIBCBarcodeType.KHHIBCBarcodeTypeConcatenated)

            this.barcodeType = KHHIBCBarcodeType.KHHIBCBarcodeTypeConcatenated
            this.labelerIDCode = primary.labelerIDCode
            this.productNumber = primary.productNumber
            this.unitOfMeasure = primary.unitOfMeasure
            this.linkCharacter = secondary.linkCharacter
            this.checkCharacter = secondary.checkCharacter
            this.expirationDate = secondary.expirationDate
            this.quantity = secondary.quantity
            this.serial = secondary.serial
            this.lot = secondary.lot

            return this
        } else {
            return null
        }
    },

    deviceID: function() {
        if (this.labelerIDCode) {
            return String(this.labelerIDCode) + String(this.productNumber) + String(this.unitOfMeasure)
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
        if (primary.length < (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary ? 6 : 7)) {
            return null
        }

        this.barcodeType = barcodeType
        this.labelerIDCode = primary.substr(0, 4)
        primary = primary.substr(4, primary.length - 4)
        this.productNumber = primary.substr(0, primary.length - 
            (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary ? 2 : 1))
        primary = primary.substr(primary.length - 
            (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary ? 2 : 1),
            (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary ? 2 : 1))
        this.unitOfMeasure = parseInt(primary[0])

        if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypePrimary) {
            this.checkCharacter = primary[1]
        }

        return this
    },

    hibcForSecondaryString: function(secondary, barcodeType) {
        var secondaryComponents = secondary.split("/")
        secondaryComponents = secondaryComponents.filter(function(component) {
            return component.length > 0
        })

        this.barcodeType = barcodeType

        if (secondaryComponents.length > 1) {
            var lastComponent = secondaryComponents[secondaryComponents.length - 1]
            var checkCharacter = lastComponent.substr(lastComponent.length-1, 1)
            var linkCharacter = null

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                linkCharacter = lastComponent.substr(lastComponent.length-2, 1)
                secondary = String(secondaryComponents[0]) + String(linkCharacter) + String(checkCharacter)
                lastComponent = lastComponent.substr(0, lastComponent.length-2)
                secondaryComponents[secondaryComponents.length-1] = lastComponent
            } else {
                secondary = String(secondaryComponents[0]) + String(checkCharacter)
                lastComponent = lastComponent.substr(0, lastComponent.length-1)
                secondaryComponents[secondaryComponents.length-1] = lastComponent
            }
        }

        var firstChar = secondary[0]
        var secondChar = secondary[1]
        var thirdChar = secondary[2]

        if (this.isNumber(firstChar)) {
            var julianString = secondary.substr(0, 5)
            this.expirationDate = moment(julianString, "YYDDD").toDate()
            secondary = secondary.substr(5)
            this.checkCharacter = secondary[secondary.length-1]

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                this.linkCharacter = secondary[secondary.length-2]
                this.lot = secondary.substr(0, secondary.length-2)
            } else {
                this.lot = secondary.substr(0, secondary.length-1)
            }

        } else if (firstChar === "$" && this.isAlphanumeric(secondChar)) {
            this.checkCharacter = secondary[secondary.length-1]

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                this.linkCharacter = secondary[secondary.length-2]
                this.lot = secondary.substr(1, secondary.length-3)
            } else {
                this.lot = secondary.substr(1, secondary.length-2)
            }
        } else if (secondary.substr(0,2) === "$+" && this.isAlphanumeric(thirdChar)) {
            secondary = secondary.replace(/\$/g, "")
            secondary = secondary.replace(/\+/g, "")
            this.checkCharacter = secondary[secondary.length-1]

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                this.linkCharacter = secondary[secondary.length-2]
                this.serial = secondary.substr(0, secondary.length-2)
            } else {
                this.serial = secondary.substr(0, secondary.length-1)
            }
        } else if (secondary.substr(0,2) === "$$" && this.isAlphanumeric(thirdChar)) {
            secondary = secondary.replace(/\$/g, "")
            this.checkCharacter = secondary[secondary.length-1]

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                this.linkCharacter = secondary[secondary.length-2]
                secondary = secondary.substr(0, secondary.length-2)
            } else {
                secondary = secondary.substr(0, secondary.length-1)
            }

            var i = parseInt(secondary[0])
            var noLot = false
            if (i == 8) {
                secondary = secondary.substr(1, secondary.length-1)
                this.quantity = parseInt(secondary.substr(0, 2))
                secondary = secondary.substr(2, secondary.length-2)
                if (secondary.length == 0) {
                    noLot = true
                }
            } else if (i == 9) {
                secondary = secondary.substr(1, secondary.length-1)
                this.quantity = parseInt(secondary.substr(0, 5))
                secondary = secondary.substr(5)
                if (secondary.length == 0) {
                    noLot = true
                }
            }

            if (!noLot) {
                this.expirationDate = this.dateFromDateString(secondary)
                secondary = this.substringFromDateString(secondary)
                this.lot = secondary
            }
        } else if (secondary.substr(0, 3) === "$$+") {
            secondary = secondary.replace(/\$/g, "")
            secondary = secondary.replace(/\+/g, "")
            this.checkCharacter = secondary[secondary.length-1]

            if (barcodeType == KHHIBCBarcodeType.KHHIBCBarcodeTypeSecondary) {
                this.linkCharacter = secondary[secondary.length-2]
                this.serial = secondary.substr(0, secondary.length-2)
            } else {
                this.serial = secondary.substr(0, secondary.length-1)
            }

            this.expirationDate = this.dateFromDateString(secondary)
            secondary = this.substringFromDateString(secondary)
            this.serial = secondary
        } else {
            return null
        }

        if (secondaryComponents.length > 1) {

            var supplementalComponents = secondaryComponents.slice(1)

            for(var supplementalComponent in supplementalComponents) {
                if (supplementalComponent.substr(0, 3) === "14D") {
                    this.expirationDate = moment(supplementalComponent.substr(3), "YYYYMMDD").toDate()
                } else if (supplementalComponent.substr(0, 3) === "16D") {
                    this.manufacturingDate = moment(supplementalComponent.substr(3), "YYYYMMDD").toDate()
                } else if (supplementalComponent[0] == "S") {
                    this.serial = supplementalComponent.substr(1)
                }
            }
        }

        return this
    },

    dateFromDateString: function(string) {
        var i = parseInt(string[0])

        switch (i) {
            case 0:

            case 1: {
                var dateString = string.substr(0, 4)
                return moment(dateString, "MMYY").toDate()
            }
            case 2: {
                var dateString = string.substr(1, 6)
                return moment(dateString, "MMDDYY").toDate()
            }
            case 3: {
                var dateString = string.substr(1, 6)
                return moment(dateString, "YYMMDD").toDate()
            }
            case 4: {
                var dateString = string.substr(1, 8)
                return moment(dateString, "YYMMDDHH").toDate()
            }
            case 5: {
                var dateString = string.substr(1, 5)
                return moment(dateString, "YYDDD").toDate()
            }
            case 6: {
                var dateString = string.substr(1, 7)
                return moment(dateString, "YYDDDHH").toDate()
            }
            case 7: {
                return null
            }
            default:
                return null
        }
    },

    substringFromDateString: function(string) {
        var i = parseInt(string[0])

        switch (i) {
            case 0:
            case 1:
                return string.substr(4, string.length - 4)
            case 2:
                return string.substr(7, string.length - 7)
            case 3:
                return string.substr(7, string.length - 7)
            case 4:
                return string.substr(9, string.length - 9)
            case 5:
                return string.substr(6, string.length - 6)
            case 6:
                return string.substr(8, string.length - 8)
            case 7:
                return string.substr(1, string.length - 1)
            default:
                return ""
        }
    },

    isNumber: function(string) {
        return /^\d+$/.test(string)
    },

    isAlphanumeric: function(string) {
        return /^[a-z0-9]+$/i.test(string)
    },

    isLetter: function(string) {
        return /^[a-zA-Z]+$/.test(string);
    },

    splitWithLimit: function(str, separator , limit){
        //Similar to str.split but combines the remaining components in the last component

        var allComponents = str.split(separator);
        var components = [];

        for(var i = 0; i < allComponents.length; i++){
            var s = allComponents[i];
            if(components.length < limit){
                components.push(s);
            } else {
                //We hit our limit, append to the last component
                var lastComponent = components[1];
                lastComponent = lastComponent + separator + s;
                components[i - 1] = lastComponent;
            }
        }

        return components;
    }
}

module.exports = KHHIBC