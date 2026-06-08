import { useState, useEffect } from 'react'
import { isoToDisplay, displayToIso, formatDateDigits } from '../../utils/dateInput'

export default function DateInput({
  value = '',
  onChange,
  style,
  placeholder = 'дд/мм/гггг',
  ...rest
}) {
  const [text, setText] = useState(() => isoToDisplay(value))

  useEffect(() => {
    setText(isoToDisplay(value))
  }, [value])

  const handleBlur = () => {
    if (!text) {
      onChange?.('')
      return
    }
    const iso = displayToIso(text)
    if (iso) {
      onChange?.(iso)
      setText(isoToDisplay(iso))
    } else {
      setText(isoToDisplay(value))
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      maxLength={10}
      style={style}
      onChange={e => {
        const formatted = formatDateDigits(e.target.value)
        setText(formatted)
        if (!formatted) {
          onChange?.('')
        } else if (formatted.length === 10) {
          const iso = displayToIso(formatted)
          if (iso) onChange?.(iso)
        }
      }}
      onBlur={handleBlur}
      {...rest}
    />
  )
}
