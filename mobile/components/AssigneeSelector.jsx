import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const AssigneeSelector = ({
  visible,
  onClose,
  boardMembers,
  currentAssignee,
  onSelectAssignee,
  isLoading,
}) => {
  const { colors: COLORS } = useTheme();

  const handleSelectMember = (member) => {
    onSelectAssignee(member);
    onClose();
  };

  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            paddingHorizontal: 20,
            maxHeight: '70%',
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}
            >
              Select Assignee
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
              }}
            >
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                style={{ marginTop: 10, color: COLORS.textLight, fontSize: 14 }}
              >
                Loading members...
              </Text>
            </View>
          ) : (
            <>
              {/* Unassign Option */}
              <TouchableOpacity
                onPress={() => handleSelectMember(null)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.background,
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: COLORS.textLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="person-remove" size={20} color={COLORS.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.text,
                    }}
                  >
                    Unassigned
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textLight,
                      marginTop: 2,
                    }}
                  >
                    Remove assignee from this task
                  </Text>
                </View>
                {!currentAssignee && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>

              {/* Members List */}
              <FlatList
                data={boardMembers}
                keyExtractor={(item) => item.user_id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = currentAssignee?.user_id === item.user_id;
                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectMember(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: COLORS.background,
                        padding: 16,
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? COLORS.primary : COLORS.border,
                      }}
                    >
                      {/* Avatar */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: COLORS.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: COLORS.white,
                          }}
                        >
                          {getInitials(item.email)}
                        </Text>
                      </View>

                      {/* Member Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: COLORS.text,
                          }}
                        >
                          {item.username || 'Unknown User'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: COLORS.textLight,
                            marginTop: 2,
                          }}
                        >
                          {item.email}
                        </Text>
                      </View>

                      {/* Checkmark for Selected */}
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AssigneeSelector;