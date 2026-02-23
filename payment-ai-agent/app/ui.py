import streamlit as st
from agent.executor import run_agent

st.set_page_config(page_title="Payment AI Agent", layout="wide")

st.title("💳 Payment Investigation AI Agent")

query = st.text_input("Ask about a payment tracking ID")

if st.button("Investigate") and query:
    with st.spinner("Agent is investigating..."):
        result = run_agent(query)

    st.subheader("Result")
    st.subheader("Investigation Summary")
    st.text(result["summary"])

    with st.expander("Technical Details"):
        st.json(result["details"])