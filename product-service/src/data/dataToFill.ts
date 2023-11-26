
const products = [
    {
      description: "Short Python For Dummies Description",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
      price: 24,
      title: "Python For Dummies",
    },
    {
      description: "Short Java For Dummies Description",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
      price: 15,
      title: "Java For Dummies",
    },
    {
      description: "Short JavaScript For Dummies Description",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
      price: 23,
      title: "JavaScript For Dummies",
    },
    {
      description: "Short C++ For Dummies Description",
      id: "7567ec4b-b10c-48c5-9345-fc73348a80a1",
      price: 15,
      title: "C++ For Dummies",
    },
    {
      description: "Short C# For Dummies Descriptio",
      id: "7567ec4b-b10c-48c5-9445-fc73c48a80a2",
      price: 23,
      title: "C# For Dummies",
    },
    {
      description: "Short Ruby For Dummies Description",
      id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
      price: 15,
      title: "Ruby For Dummies",
    },
];

const mainFunc = async () => {

    const data = products.map((item) => ({
        PutRequest: {
            Item: {
                description: {
                    S: item.description,
                },
                id: {
                    S: item.id,
                },
                price: {
                    N: item.price,
                },
                title: {
                    S: item.title
                }
            }
        }
    }));

    const resData = { products: data }

    return JSON.stringify(resData);
}

mainFunc()