const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
];

function convertGroup(n) {
  let output = '';
  if (n >= 100) {
    output += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    output += tens[Math.floor(n / 10)];
    if (n % 10 > 0) {
      output += '-' + ones[n % 10];
    }
    output += ' ';
  } else if (n > 0) {
    output += ones[n] + ' ';
  }
  return output;
}

function integerToWords(num) {
  if (num === 0) return 'Zero';

  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
  let parts = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const chunkWords = convertGroup(chunk).trim();
      const scale = scales[scaleIndex];
      parts.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return parts.join(' ').trim();
}

/**
 * Converts numeric amount to official invoice verbal expression
 * e.g., 21431.50 -> "United States Dollars Twenty-One Thousand Four Hundred Thirty-One and Cents Fifty Only"
 */
function numberToWords(amount, currency = 'USD') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '';
  }

  const num = Math.abs(Number(amount));
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  const currencyNames = {
    USD: { full: 'United States Dollars', sub: 'Cents' },
    EUR: { full: 'Euros', sub: 'Cents' },
    GBP: { full: 'British Pounds', sub: 'Pence' },
    AED: { full: 'UAE Dirhams', sub: 'Fils' },
    LKR: { full: 'Sri Lankan Rupees', sub: 'Cents' },
    SGD: { full: 'Singapore Dollars', sub: 'Cents' },
    CAD: { full: 'Canadian Dollars', sub: 'Cents' },
    AUD: { full: 'Australian Dollars', sub: 'Cents' },
  };

  const curr = currencyNames[currency.toUpperCase()] || {
    full: `${currency.toUpperCase()}`,
    sub: 'Cents',
  };

  const intWords = integerToWords(intPart);
  let result = `${curr.full} ${intWords}`;

  if (decimalPart > 0) {
    const decimalWords = integerToWords(decimalPart);
    result += ` and ${curr.sub} ${decimalWords} Only`;
  } else {
    result += ' Only';
  }

  return result.replace(/\s+/g, ' ').trim();
}

module.exports = { numberToWords, integerToWords };
