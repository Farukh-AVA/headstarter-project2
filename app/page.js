'use client'
import Image from "next/image";     
import { useState, useEffect, useRef } from "react";
import { firestore } from "../firebase"
import { Box, Modal, TextField, Typography, Stack, Button, Grid, Card, CardContent } from "@mui/material";
import { query, collection, getDocs, getDoc, setDoc, deleteDoc, doc } from "firebase/firestore";

export default function Home() {

  const [inventory, setInventory] = useState([]);
  const [itemName, setItemName] = useState('');
  const [open, setOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedItem, setHighlightedItem] = useState(null);
  const inventoryRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    console.log(inventoryList);
  };

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const searchItem = (query) => {
    const item = inventory.find(({ name }) => name.toLowerCase() === query.toLowerCase());
    if (item) {
      setHighlightedItem(item.name);
      // Scroll to the item
      if (inventoryRef.current) {
        const itemElement = inventoryRef.current.querySelector(`#item-${item.name}`);
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      setHighlightedItem(null);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      searchItem(searchQuery);
    } else {
      setHighlightedItem(null);
    }
  }, [searchQuery, inventory]);

  return (
    <Box
      width="100vw"
      height='100vh'
      display='flex'
      flexDirection='column'
      justifyContent='center'
      alignItems='center'
      gap={2}
      bgcolor="#f9f9f9"
    >
      <Box 
        width='100%'
        display='flex'
        justifyContent='center'
        alignItems='center'
        position='fixed'
        top={0}
        zIndex={1000}
        bgcolor="#fff"
        p={2}
        boxShadow={3}
      >
        <TextField
          variant="outlined"
          placeholder="Search Item"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ marginRight: 2, width: '40%' }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
        >
          Add New Item
        </Button>
      </Box>
      <Box 
        mt={10}
        width='100%'
        bgcolor='#ADD8E6'
        display='flex'
        alignItems="center" 
        justifyContent="center"
        p={2}
      >
        <Typography variant="h4" color="#333">
          Inventory Items
        </Typography>
      </Box>
      <Grid container spacing={2} ref={inventoryRef} sx={{ width: '80%', marginTop: 2 }}>
        {
          inventory.map(({ name, quantity }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card id={`item-${name}`} sx={{ bgcolor: highlightedItem === name ? '#FFD700' : '#fff' }}>
                <CardContent>
                  <Typography variant="h5" textAlign='center' textTransform={"capitalize"}>
                    {name}
                  </Typography>
                  <Typography variant="h6" textAlign='center'>
                    Quantity: {quantity}
                  </Typography>
                  <Stack direction='row' spacing={2} justifyContent="center" mt={2}>
                    <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>Remove</Button>
                    <Button variant="contained" color="primary" onClick={() => addItem(name)}>Add</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        }
      </Grid>
      <Modal open={open} onClose={handleClose}>
        <Box
          position='absolute'
          top='50%'
          left='50%'
          width={400}
          bgcolor="white"
          borderRadius={2}
          boxShadow={24}
          p={4}
          display='flex'
          flexDirection='column'
          gap={3}
          sx={{ transform: 'translate(-50%,-50%)' }}
        >
          <Typography variant='h6'>Add Item</Typography>
          <Stack
            width='100%'
            direction='row'
            spacing={2}
          >
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant='contained'
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >Add</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}

