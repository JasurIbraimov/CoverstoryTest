const express = require("express");
const cors = require("cors");
const { db } = require("./functions/firebase");
const multer = require("multer");
const serverless = require("serverless-http");
const u = require("./functions/utils");

const SUCCESS = 200,
  BAD_REQUEST = 400,
  SERVER_ERROR = 500;

let app = express();
const router = express.Router();
let upload = multer();




router.get("/categories", async (req, res) => {
  try {
    const categories = await db.listCollections() 
    const listOfItems = await Promise.all(categories.map(async ( category ) => {
      let limits = parseInt(req.query.limits) || 10;
      let page = parseInt(req.query.page) || 1;
      let offset = limits * (page - 1);
      const collectionsWithItems = await u.getAllItemsFromCollection(category, offset, limits);
      return {
        categoryTitle: category.id, 
        collections: collectionsWithItems 
      };
    }))
    res.status(SUCCESS).send(listOfItems)
  } catch (e) {
    return res
      .status(SERVER_ERROR)
      .send({ message: "Error while fetching items! " + e.message });
  }
});

router.post(
  "/create/:collection/:documentName",
  upload.single("file"),
  async (req, res) => {
    const { title, price } = req.body;
    const { collection, documentName } = req.params;
    if (!title || title.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Title is not provided!" });
    }
    if (!price || price.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Price is not provided!" });
    }
    if (!collection || collection.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Collection is not provided!" });
    }
    if (!documentName || documentName.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Document name is not provided!" });
    }
    if (!req.file) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Image of the item is not provided!" });
    }

    try {
      const item = {
        title,
        image: req.file,
        price,
      };
      await u.addItemToCollection(collection, documentName, item);
      return res.status(SUCCESS).send({ message: "Successfully created" });
    } catch (e) {
      return res
        .status(SERVER_ERROR)
        .send({ message: "Error while creating item! " + e.message });
    }
  }
);
router.delete("/delete/:collection/:documentName/:id", async (req, res) => {
  const { id, collection, documentName } = req.params;
  console.log(collection, documentName)
  if (!collection || collection.trim().length === 0) {
    return res
      .status(BAD_REQUEST)
      .send({ message: "Collection is not provided!" });
  }
  if (!documentName || documentName.trim().length === 0) {
    return res
      .status(BAD_REQUEST)
      .send({ message: "Document name is not provided!" });
  }
  if (!id || id.trim().length === 0) {
    return res.status(BAD_REQUEST).send({ message: "Id is not provided" });
  }
  try {
    await u.deleteItemFromDocument(id, collection, documentName);
    return res.status(SUCCESS).send({ message: "Succefuly deleted" });
  } catch (e) {
    return res
      .status(SERVER_ERROR)
      .send({ message: "Error while deleting item! " + e.message });
  }
});
router.put(
  "/update/:collection/:documentName/:id",
  upload.single("image"),
  async (req, res) => {
    const { title, price } = req.body;
    const { collection, documentName , id} = req.params;
    if (!id || id.trim().length === 0) {
      return res.status(BAD_REQUEST).send({ message: "Id is not provided" });
    }
    if (!collection || collection.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Collection is not provided!" });
    }
    if (!documentName || documentName.trim().length === 0) {
      return res
        .status(BAD_REQUEST)
        .send({ message: "Document name is not provided!" });
    }

    try {
      const item = {
        title,
        image: req.file,
        price,
        id
      };
      await u.updateItemInCollection(collection, documentName, item);
      return res.status(SUCCESS).send({ message: "Succefuly updated" });
    } catch (e) {
      return res
        .status(SERVER_ERROR)
        .send({ message: "Error while updating item! " + e.message });
    }
  }
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use("/.netlify/functions/api", router);

module.exports.handler = serverless(app);