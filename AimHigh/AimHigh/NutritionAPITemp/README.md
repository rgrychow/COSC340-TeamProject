# install deps and create your .env from the example
npm install         # recreates node_modules from package.json
cp .env.example .env && nano .env  # fill in keys locally

# run
node macro.cjs "chicken breast" (Example)
