// src/components/__tests__/ChatScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';
import axios from 'axios';

jest.mock('axios');

describe('ChatScreen Component', () => {
  it('renders correctly and sends message', async () => {
    // axios 모의 응답 설정
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { pronouncedText: 'Mocked bot response' },
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<ChatScreen />);
    
    const input = getByPlaceholderText('메시지 입력');
    const sendButton = getByText('Send');

    // 입력창에 메시지 입력
    fireEvent.changeText(input, 'Hello');
    fireEvent.press(sendButton);

    // 사용자의 메시지가 화면에 렌더링되는지 확인
    await waitFor(() => {
      expect(queryByText('Hello')).toBeTruthy();
      expect(queryByText('Mocked bot response')).toBeTruthy();
    });
  });
});
