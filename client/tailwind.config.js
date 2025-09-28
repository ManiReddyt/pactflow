export default {
  content: ["./src/**/*.tsx", "./src/**/*.css"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f0ff",
          100: "#e6e6ff",
          500: "#1c01fe",
          600: "#1a01e5",
          700: "#1701cc",
        },
        secondary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#1cdc77",
          600: "#19c66a",
          700: "#16b05d",
        },
        dark: {
          50: "#f8fafc",
          100: "#f1f5f9",
          500: "#141e41",
          600: "#121b3a",
          700: "#0f1833",
        },
        light: {
          50: "#fafafa",
          100: "#f4f4f5",
          500: "#9695a7",
          600: "#868596",
          700: "#767585",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #1c01fe 0%, #1cdc77 100%)",
        "gradient-dark": "linear-gradient(135deg, #141e41 0%, #1c01fe 100%)",
      },
    },
  },
  plugins: [],
};
