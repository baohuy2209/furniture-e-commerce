const cursor = db.products.find({
  search_text: { $exists: false },
});

while (await cursor.hasNext()) {
  const p = await cursor.next();

  await db.products.updateOne(
    { _id: p._id },
    {
      $set: {
        search_text: normalize(`${p.title} ${p.description}`),
      },
    },
  );
}
