FROM node:20
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    git \
    ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Set environment variables (Defaults)
ENV SESSION_TYPE=firebase
ENV SESSION_ID=farhanbot-session
# Hugging Face uses 7860 by default
ENV PORT=7860
EXPOSE 7860

# Run the bot
CMD [ "npm", "start" ]
