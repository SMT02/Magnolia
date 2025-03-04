/** @type {import('tailwindcss').Config} */
export default {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik-Regular', 'sans-serif'],
        "Rubik-Bold": ['Rubik-Bold', 'sans-serif'],
        "Rubik-ExtraBold": ['Rubik-ExtraBold', 'sans-serif'],
        "Rubik-Medium": ['Rubik-Medium', 'sans-serif'],
        "Rubik-Semibold": ['Rubik-SemiBold', 'sans-serif'],
        "Rubik-Light": ['Rubik-Light', 'sans-serif'],  
      },
      colors: {
        "primary": {
          100: '#32a8520A',
          300: '#32a852'
        },
        accent: {
          100: '#FBFBFD'
        },
        black: {
          DEFAULT: '#000000',
          100: '#8c8e98',
          200: '#666876',
          300: '#191d31',  
        },
        danger: {
          DEFAULT: '#F75555',
        }
      }
    }
  },
  plugins: [],
}
