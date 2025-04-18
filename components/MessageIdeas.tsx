import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  onSelectCard: (text: string) => void;
}

const MessageIdeas = ({ onSelectCard }: Props) => {
  const ideas = [
    "What items are on sale today?",
    "I need to plan a dinner for 4 people",
    "What aisle can I find pasta in?",
    "Add milk to my shopping list",
    "What are good substitutes for butter?",
    "Help me find gluten-free options"
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Try asking about...</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ideas.map((idea, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => onSelectCard(idea)}
          >
            <Text style={styles.cardText}>{idea}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 5,
    gap: 10,
  },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 12,
    maxWidth: 200,
  },
  cardText: {
    fontSize: 14,
    color: '#32a852',
  },
});

export default MessageIdeas; 