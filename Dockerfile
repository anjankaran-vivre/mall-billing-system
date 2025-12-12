FROM node:18-bullseye

# Create app directory
WORKDIR /app

# Install dependencies first (cache)
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy app source
COPY . ./

# Expose Vite dev server port
EXPOSE 5173

# Default command runs dev server on 0.0.0.0 so it's reachable from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
