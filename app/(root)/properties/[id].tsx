import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const Food = () => {
    const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Food {id} </Text>
    </View>
  )
}

export default Food
