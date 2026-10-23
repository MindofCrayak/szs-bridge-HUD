const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyPqkuQLlZAG5MlYl_4SkYbUv19pA44IXaxDhsTpNSzc2KgJiV2OuC1gKTMQp_Hc__Y/exec';

export const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_API_URL;
export const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY;
