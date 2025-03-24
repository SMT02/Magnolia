import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

<<<<<<< HEAD
const Food = () => {
    const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Food {id} </Text>
=======
const Good = () => {
    const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Good {id} </Text>
>>>>>>> AdamDatabaseBranch2
    </View>
  )
}

<<<<<<< HEAD
export default Food
=======
export default Good
>>>>>>> AdamDatabaseBranch2
