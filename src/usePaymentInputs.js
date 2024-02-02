import React from 'react';

import utils from './utils';

export default function usePaymentCard({
  autoFocus = true,
  errorMessages,
  onTouch,
  onInput,
  onChange,
  onBlur,
  onError,
  cardNumberValidator,
  cvcValidator,
  expiryValidator
} = {}) {
  const cardNumberField = React.useRef();
  const expiryDateField = React.useRef();
  const cvcField = React.useRef();
  const zipField = React.useRef();

  /** ====== START: META STUFF ====== */
  const [touchedInputs, setTouchedInputs] = React.useState({
    cardNumber: false,
    expiryDate: false,
    cvc: false,
    zip: false
  });
  const [isTouched, setIsTouched] = React.useState(false);
  const [erroredInputs, setErroredInputs] = React.useState({
    cardNumber: undefined,
    expiryDate: undefined,
    cvc: undefined,
    zip: undefined
  });
  const [error, setError] = React.useState();
  const [cardType, setCardType] = React.useState();
  const [focused, setFocused] = React.useState();

  const setInputError = React.useCallback((input, error) => {
    setErroredInputs(erroredInputs => {
      if (erroredInputs[input] === error) return erroredInputs;

      let newError = error;
      const newErroredInputs = { ...erroredInputs, [input]: error };
      if (error) {
        setError(error);
      } else {
        newError = Object.values(newErroredInputs).find(Boolean);
        setError(newError);
      }
      onError && onError(newError, newErroredInputs);
      return newErroredInputs;
    });
  }, []); // eslint-disable-line

  const setInputTouched = React.useCallback((input, value) => {
    requestAnimationFrame(() => {
      if (document.activeElement.tagName !== 'INPUT') {
        setIsTouched(true);
      } else if (value === false) {
        setIsTouched(false);
      }
    });

    setTouchedInputs(touchedInputs => {
      if (touchedInputs[input] === value) return touchedInputs;

      const newTouchedInputs = { ...touchedInputs, [input]: value };
      onTouch && onTouch({ [input]: value }, newTouchedInputs);
      return newTouchedInputs;
    });
  }, []); // eslint-disable-line
  /** ====== END: META STUFF ====== */

  /** ====== START: CARD NUMBER STUFF ====== */
  const handleFocusCardNumber = React.useCallback((props = {}) => {
    return e => {
      props.onFocus && props.onFocus(e);
      setFocused('cardNumber');
    };
  }, []);

  const handleKeyPressCardNumber = React.useCallback((props = {}) => {
    return e => {
      const formattedCardNumber = e.target.value || '';
      const cardNumber = formattedCardNumber.replace(/\s/g, '');

      props.onKeyPress && props.onKeyPress(e);

      if (e.key !== utils.ENTER_KEY_CODE) {
        if (!utils.validator.isNumeric(e)) {
          e.preventDefault();
        }
        if (utils.validator.hasCardNumberReachedMaxLength(cardNumber)) {
          e.preventDefault();
        }
      }
    };
  }, []);

  const handleChangeCardNumber = React.useCallback(
    (props = {}) => {
      return e => {
        const formattedCardNumber = e.target.value || '';
        const cardNumber = formattedCardNumber.replace(/\s/g, '');
        let cursorPosition = cardNumberField.current.selectionStart;

        const cardType = utils.cardTypes.getCardTypeByValue(cardNumber);
        setCardType(cardType);

        // @ts-ignore
        cardNumberField.current.value = utils.formatter.formatCardNumber(cardNumber);

        props.onInput && props.onInput(e);
        props.onChange && props.onChange(e);
        onInput && onInput(e);
        onChange && onChange(e);

        // Due to the card number formatting, the selection cursor will fall to the end of
        // the input field. Here, we want to reposition the cursor to the correct place.
        requestAnimationFrame(() => {
          if (document.activeElement !== cardNumberField.current) return;
          if (cardNumberField.current.value[cursorPosition - 1] === ' ') {
            cursorPosition = cursorPosition + 1;
          }
          cardNumberField.current.setSelectionRange(cursorPosition, cursorPosition);
        });

        const cardNumberError = utils.validator.getCardNumberError(cardNumber, cardNumberValidator, { errorMessages });
        if (!cardNumberError && autoFocus) {
          expiryDateField.current && expiryDateField.current.focus();
        }
        setInputTouched('cardNumber', !cardNumberError);
        setInputError('cardNumber', cardNumberError);
        props.onError && props.onError(cardNumberError);
      };
    },
    [autoFocus, cardNumberValidator, errorMessages, onInput, onChange, setInputError, setInputTouched]
  );

  const handleBlurCardNumber = React.useCallback(
    (props = {}) => {
      return e => {
        props.onBlur && props.onBlur(e);
        onBlur && onBlur(e);
        setFocused(undefined);
        setInputTouched('cardNumber', true);
      };
    },
    [onBlur, setInputTouched]
  );

  const getCardNumberProps = React.useCallback(
    ({ refKey, ...props } = {}) => ({
      'aria-label': 'Card number',
      autoComplete: 'cc-number',
      id: 'cardNumber',
      name: 'cardNumber',
      placeholder: 'Card number',
      type: 'tel',
      [refKey || 'ref']: cardNumberField,
      ...props,
      onFocus: handleFocusCardNumber(props),
      onKeyPress: handleKeyPressCardNumber(props),
      onInput: handleChangeCardNumber(props),
      onChange: handleChangeCardNumber(props),
      onBlur: handleBlurCardNumber(props)
    }),
    [handleFocusCardNumber, handleKeyPressCardNumber, handleChangeCardNumber, handleBlurCardNumber]
  );

  React.useEffect(
    () => {
      const timeout = window.setTimeout(() => {
        if (cardNumberField.current && !cardType) {
          const formattedCardNumber = cardNumberField.current.value || '';
          const cardNumber = formattedCardNumber.replace(/\s/g, '');
          const analyzedCardType = utils.cardTypes.getCardTypeByValue(cardNumber);

          setCardType(analyzedCardType);
          clearTimeout(timeout);
        }
      }, 100);

      return () => {
        window.clearTimeout(timeout);
      };
    },
    [cardType]
  );
  /** ====== END: CARD NUMBER STUFF ====== */

  /** ====== START: EXPIRY DATE STUFF ====== */
  const handleFocusExpiryDate = React.useCallback((props = {}) => {
    return e => {
      props.onFocus && props.onFocus(e);
      setFocused('expiryDate');
    };
  }, []);

  const handleKeyDownExpiryDate = React.useCallback(
    (props = {}) => {
      return e => {
        props.onKeyDown && props.onKeyDown(e);

        if (e.key === utils.BACKSPACE_KEY_CODE && !e.target.value && autoFocus) {
          cardNumberField.current && cardNumberField.current.focus();
        }
      };
    },
    [autoFocus]
  );

  const handleKeyPressExpiryDate = React.useCallback((props = {}) => {
    return e => {
      const formattedExpiryDate = e.target.value || '';
      const expiryDate = formattedExpiryDate.replace(' / ', '');

      props.onKeyPress && props.onKeyPress(e);

      if (e.key !== utils.ENTER_KEY_CODE) {
        if (!utils.validator.isNumeric(e)) {
          e.preventDefault();
        }
        if (expiryDate.length >= 4) {
          e.preventDefault();
        }
      }
    };
  }, []);

  const handleChangeExpiryDate = React.useCallback(
    (props = {}) => {
      return e => {
        expiryDateField.current.value = utils.formatter.formatExpiry(e);

        props.onInput && props.onInput(e);
        props.onChange && props.onChange(e);
        onInput && onInput(e);
        onChange && onChange(e);

        const expiryDateError = utils.validator.getExpiryDateError(expiryDateField.current.value, expiryValidator, {
          errorMessages
        });
        if (!expiryDateError && autoFocus) {
          cvcField.current && cvcField.current.focus();
        }
        setInputTouched('expiryDate', !expiryDateError);
        setInputError('expiryDate', expiryDateError);
        props.onError && props.onError(expiryDateError);
      };
    },
    [autoFocus, errorMessages, expiryValidator, onInput, onChange, setInputError, setInputTouched]
  );

  const handleBlurExpiryDate = React.useCallback(
    (props = {}) => {
      return e => {
        props.onBlur && props.onBlur(e);
        onBlur && onBlur(e);
        setFocused(undefined);
        setInputTouched('expiryDate', true);
      };
    },
    [onBlur, setInputTouched]
  );

  const getExpiryDateProps = React.useCallback(
    ({ refKey, ...props } = {}) => ({
      'aria-label': 'Expiry date in format MM YY',
      autoComplete: 'cc-exp',
      id: 'expiryDate',
      name: 'expiryDate',
      placeholder: 'MM/YY',
      type: 'tel',
      [refKey || 'ref']: expiryDateField,
      ...props,
      onFocus: handleFocusExpiryDate(props),
      onKeyDown: handleKeyDownExpiryDate(props),
      onKeyPress: handleKeyPressExpiryDate(props),
      onInput: handleChangeExpiryDate(props),
      onChange: handleChangeExpiryDate(props),
      onBlur: handleBlurExpiryDate(props)
    }),
    [
      handleFocusExpiryDate,
      handleKeyDownExpiryDate,
      handleKeyPressExpiryDate,
      handleChangeExpiryDate,
      handleBlurExpiryDate
    ]
  );
  /** ====== END: EXPIRY DATE STUFF ====== */

  /** ====== START: CVC STUFF ====== */
  const handleFocusCVC = React.useCallback((props = {}) => {
    return e => {
      props.onFocus && props.onFocus(e);
      setFocused('cvc');
    };
  }, []);

  const handleKeyDownCVC = React.useCallback(
    (props = {}) => {
      return e => {
        props.onKeyDown && props.onKeyDown(e);

        if (e.key === utils.BACKSPACE_KEY_CODE && !e.target.value && autoFocus) {
          expiryDateField.current && expiryDateField.current.focus();
        }
      };
    },
    [autoFocus]
  );

  const handleKeyPressCVC = React.useCallback((props = {}, { cardType }) => {
    return e => {
      const formattedCVC = e.target.value || '';
      const cvc = formattedCVC.replace(' / ', '');

      props.onKeyPress && props.onKeyPress(e);

      if (e.key !== utils.ENTER_KEY_CODE) {
        if (!utils.validator.isNumeric(e)) {
          e.preventDefault();
        }
        if (cardType && cvc.length >= cardType.code.length) {
          e.preventDefault();
        }
        if (cvc.length >= 4) {
          e.preventDefault();
        }
      }
    };
  }, []);

  const handleChangeCVC = React.useCallback(
    (props = {}, { cardType } = {}) => {
      return e => {
        const cvc = e.target.value;

        props.onInput && props.onInput(e);
        props.onChange && props.onChange(e);
        onInput && onInput(e);
        onChange && onChange(e);

        const cvcError = utils.validator.getCVCError(cvc, cvcValidator, { cardType, errorMessages });
        if (!cvcError && autoFocus) {
          zipField.current && zipField.current.focus();
        }
        setInputTouched('cvc', !cvcError);
        setInputError('cvc', cvcError);
        props.onError && props.onError(cvcError);
      };
    },
    [autoFocus, cvcValidator, errorMessages, onInput, onChange, setInputError, setInputTouched]
  );

  const handleBlurCVC = React.useCallback(
    (props = {}) => {
      return e => {
        props.onBlur && props.onBlur(e);
        onBlur && onBlur(e);
        setFocused(undefined);
        setInputTouched('cvc', true);
      };
    },
    [onBlur, setInputTouched]
  );

  const getCVCProps = React.useCallback(
    ({ refKey, ...props } = {}) => ({
      'aria-label': 'CVC',
      autoComplete: 'cc-csc',
      id: 'cvc',
      name: 'cvc',
      placeholder: cardType ? cardType.code.name : 'CVC',
      type: 'tel',
      [refKey || 'ref']: cvcField,
      ...props,
      onFocus: handleFocusCVC(props),
      onKeyDown: handleKeyDownCVC(props),
      onKeyPress: handleKeyPressCVC(props, { cardType }),
      onChange: handleChangeCVC(props, { cardType }),
      onBlur: handleBlurCVC(props)
    }),
    [cardType, handleFocusCVC, handleKeyDownCVC, handleKeyPressCVC, handleChangeCVC, handleBlurCVC]
  );
  /** ====== END: CVC STUFF ====== */

  /** ====== START: ZIP STUFF ====== */
  const handleFocusZIP = React.useCallback((props = {}) => {
    return e => {
      props.onFocus && props.onFocus(e);
      setFocused('zip');
    };
  }, []);

  const handleKeyDownZIP = React.useCallback(
    (props = {}) => {
      return e => {
        props.onKeyDown && props.onKeyDown(e);

        if (e.key === utils.BACKSPACE_KEY_CODE && !e.target.value && autoFocus) {
          cvcField.current && cvcField.current.focus();
        }
      };
    },
    [autoFocus]
  );

  const handleKeyPressZIP = React.useCallback((props = {}) => {
    return e => {
      props.onKeyPress && props.onKeyPress(e);

      if (e.key !== utils.ENTER_KEY_CODE) {
        if (!utils.validator.isNumeric(e)) {
          e.preventDefault();
        }
      }
    };
  }, []);

  const handleChangeZIP = React.useCallback(
    (props = {}) => {
      return e => {
        const zip = e.target.value;

        props.onInput && props.onInput(e);
        props.onChange && props.onChange(e);
        onInput && onInput(e);
        onChange && onChange(e);

        const zipError = utils.validator.getZIPError(zip, { errorMessages });
        setInputTouched('zip', !zipError);
        setInputError('zip', zipError);
        props.onError && props.onError(zipError);
      };
    },
    [errorMessages, onInput, onChange, setInputError, setInputTouched]
  );

  const handleBlurZIP = React.useCallback(
    (props = {}) => {
      return e => {
        props.onBlur && props.onBlur(e);
        onBlur && onBlur(e);
        setFocused(undefined);
        setInputTouched('zip', true);
      };
    },
    [onBlur, setInputTouched]
  );

  const getZIPProps = React.useCallback(
    ({ refKey, ...props } = {}) => ({
      autoComplete: 'off',
      id: 'zip',
      maxLength: '6',
      name: 'zip',
      placeholder: 'ZIP',
      type: 'tel',
      [refKey || 'ref']: zipField,
      ...props,
      onFocus: handleFocusZIP(props),
      onKeyDown: handleKeyDownZIP(props),
      onKeyPress: handleKeyPressZIP(props),
      onInput: handleChangeZIP(props),
      onChange: handleChangeZIP(props),
      onBlur: handleBlurZIP(props)
    }),
    [handleFocusZIP, handleKeyDownZIP, handleKeyPressZIP, handleChangeZIP, handleBlurZIP]
  );
  /** ====== END: ZIP STUFF ====== */

  /** ====== START: CARD IMAGE STUFF ====== */
  const getCardImageProps = React.useCallback(
    (props = {}) => {
      const images = props.images || {};
      return {
        'aria-label': cardType ? cardType.displayName : 'Placeholder card',
        children: images[cardType ? cardType.type : 'placeholder'] || images.placeholder,
        width: '1.5em',
        height: '1em',
        viewBox: '0 0 24 16',
        ...props
      };
    },
    [cardType]
  );
  /** ====== END: CARD IMAGE STUFF ====== */

  // Set default field errors
  React.useLayoutEffect(
    () => {
      if (zipField.current) {
        const zipError = utils.validator.getZIPError(zipField.current.value, { errorMessages });
        setInputError('zip', zipError);
      }
      if (cvcField.current) {
        const cvcError = utils.validator.getCVCError(cvcField.current.value, cvcValidator, { errorMessages });
        setInputError('cvc', cvcError);
      }
      if (expiryDateField.current) {
        const expiryDateError = utils.validator.getExpiryDateError(expiryDateField.current.value, expiryValidator, {
          errorMessages
        });
        setInputError('expiryDate', expiryDateError);
      }
      if (cardNumberField.current) {
        const cardNumberError = utils.validator.getCardNumberError(cardNumberField.current.value, cardNumberValidator, {
          errorMessages
        });
        setInputError('cardNumber', cardNumberError);
      }
    },
    [cardNumberValidator, cvcValidator, errorMessages, expiryValidator, setInputError]
  );

  // Format default values
  React.useLayoutEffect(() => {
    if (cardNumberField.current) {
      cardNumberField.current.value = utils.formatter.formatCardNumber(cardNumberField.current.value);
    }
    if (expiryDateField.current) {
      expiryDateField.current.value = utils.formatter.formatExpiry({ target: expiryDateField.current });
    }
  }, []);

  // Set default card type
  React.useLayoutEffect(() => {
    if (cardNumberField.current) {
      const cardType = utils.cardTypes.getCardTypeByValue(cardNumberField.current.value);
      setCardType(cardType);
    }
  }, []);

  return {
    getCardImageProps,
    getCardNumberProps,
    getExpiryDateProps,
    getCVCProps,
    getZIPProps,
    wrapperProps: {
      error,
      focused,
      isTouched
    },

    meta: {
      cardType,
      erroredInputs,
      error,
      focused,
      isTouched,
      touchedInputs
    }
  };
}
