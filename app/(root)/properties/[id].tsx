import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const Good = () => {
    const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Good {id} </Text>
    </View>
  )
}

export default Good