# MemoraFYP

# React + TypeScript + Vite

## MongoDB
```sh
docker run -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password -p 27017:27017 --name mongo-db -d mongo
```
```sh
for file in JSON/*.json; do     
    collection_name=$(basename "$file" .json);  
    mongoimport  --uri "mongodb://admin:password@localhost:27017/?authSource=admin" -d test -c $collection_name $file --jsonArray; 
done
```
```sh
mongodb://admin:password@localhost:27017/?authSource=admin&readPreference=primary&ssl=false&directConnection=true
```