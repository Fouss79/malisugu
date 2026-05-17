import React from 'react'

export const apiFetch = (url, options = {}, user) => {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-USER-EMAIL": user?.email,
      ...(options.headers || {})
    }
  });
};