"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "laboratorio.validatorName";

export function useValidatorName() {
  const [validatorName, setValidatorName] = useState("");

  useEffect(() => {
    setValidatorName(window.localStorage.getItem(STORAGE_KEY) || "");
  }, []);

  function updateValidatorName(value: string) {
    setValidatorName(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  return { validatorName, setValidatorName: updateValidatorName };
}
