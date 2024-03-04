const { storage, db } = require("./firebase");

function addFileToStorage(file, folder) {
  const path = folder + "/" + file.originalname; // + randomPart ; // t-shits/image1.png
  const bucket = storage.bucket(); // getting bucket of storage
  // Mime Type
  const fileStream = bucket.file(path).createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });
  fileStream.end(file.buffer);
  return file;
}

async function getAllItemsFromCollection(collection, offset, limits) {
  const documents = await collection.listDocuments();
  const docsData = await Promise.all(
    documents.map(async (doc) => {
      const data = await doc.get();
      let documentData = data.data();
      return {
        totals: 0,
        ...documentData,
        data: documentData.data? documentData.data.slice(offset, offset + limits) : [],
      };
    })
  );
  return docsData;
}
async function addItemToCollection(collectionName, documentName, item) {
  const image = await addFileToStorage(item.image, collectionName); 
  const bucket = storage.bucket();
  const imageRef = bucket.file(collectionName + "/" + image.originalname);
  const imageURL = await imageRef.getSignedUrl({
    action: "read",
    expires: "01-01-2500",
  });

  const date = new Date();
  const collection = db.collection(collectionName);
  const id = collection.doc().id;
  const itemData = {
    date,
    id,
    ...item,
    image: imageURL[0],
  };
  const document = collection.doc(documentName);
  console.log(collectionName + " " + documentName)
  const docRef = await document.get();
  let { data: docData } = docRef.data();
  docData.push(itemData);
  await document.update({
    data: docData,
    totals: docData.length,
  });
}

async function deleteItemFromDocument(id, collectionName, documentName) {
  const collection = db.collection(collectionName);
  const document = collection.doc(documentName);
  const docRef = await document.get();
  let { data: docData } = docRef.data();
  const iToDelete = docData.findIndex((i) => i.id === id);
  if (iToDelete == -1) {
    throw new Error("Item not found 404");
  }
  const itemToDelete = docData[iToDelete];
  const url = new URL(itemToDelete.image);
  const filePath = decodeURIComponent(url);
  const splittedByQuestionMark = filePath.split("?");
  const splittedBySlash = splittedByQuestionMark[0].split("/");
  const imageName = splittedBySlash[splittedBySlash.length - 1];

  await storage
    .bucket()
    .file(collectionName + "/" + imageName)
    .delete();

  docData = [...docData.slice(0, iToDelete), ...docData.slice(iToDelete + 1)];
  // docData = docData.filter(item => item.id === id); -- Second way to remove item in array

  await document.update({
    data: docData,
    totals: docData.length,
  });
}
async function updateItemInCollection(collectionName, documentName, item) {
  const collection = db.collection(collectionName);

  const document = collection.doc(documentName);
  const docRef = await document.get();
  let { data: docData } = docRef.data();
   const iToUpdate = docData.findIndex((i) => i.id === item.id);
  if (iToUpdate == -1) {
    throw new Error("Item not found 404");
  }
  if (item.image) {
    const image = await addFileToStorage(item.image, collectionName); // added to storage
    // Get A URL of an IMAGE
    const bucket = storage.bucket();
    const imageRef = bucket.file(documentName + "/" + image.originalname);
    const imageURL = await imageRef.getSignedUrl({
      action: "read",
      expires: "01-01-2500",
    });
    item.image = imageURL[0]
  }
  const date = new Date();
  const itemData = {
    date,
    ...item,
  };
  console.log(itemData)
  for( let key in itemData){
    if(itemData[key]){
      if(itemData[key] != docData[iToUpdate][key]){
        docData[iToUpdate][key] = itemData[key]
      }
    }
  }
  await document.update({
    data: docData,
  });

}

module.exports = {
  addFileToStorage,
  getAllItemsFromCollection,
  addItemToCollection,
  deleteItemFromDocument,
  updateItemInCollection,
};
